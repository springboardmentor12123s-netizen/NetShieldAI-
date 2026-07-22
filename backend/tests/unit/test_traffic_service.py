"""NetShield AI - Unit Tests for TrafficService."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import pytest

from app.schemas.traffic import TrafficIngestRequest
from app.services.traffic_service import TrafficService


@pytest.fixture
def mock_mongodb():
    """Create a mock MongoDB client database."""
    db = MagicMock()
    # Mock collection find cursor
    collection = MagicMock()
    db.__getitem__.return_value = collection
    return db


@pytest.mark.asyncio
async def test_list_traffic_success(mock_mongodb):
    """Test successful paginated listing of traffic logs."""
    traffic_service = TrafficService(mock_mongodb)
    collection = mock_mongodb["traffic_logs"]

    mock_doc = {
        "_id": "60d0fe4f5311236168a109a2",
        "timestamp": datetime.now(timezone.utc),
        "src_ip": "10.0.0.1",
        "dst_ip": "10.0.0.2",
        "src_port": 443,
        "dst_port": 80,
        "protocol": "TCP",
        "bytes_sent": 100,
        "bytes_received": 200,
        "packet_count": 5,
        "flags": ["SYN"],
        "duration_ms": 100,
        "geo": {"src_country": "US", "dst_country": "US"},
        "metadata": {},
    }

    collection.count_documents = AsyncMock(return_value=1)

    # Mock cursor iteration
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.skip.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor

    async def mock_async_iter(*args, **kwargs):
        yield mock_doc

    mock_cursor.__aiter__ = mock_async_iter
    collection.find.return_value = mock_cursor

    logs, total = await traffic_service.list_traffic(page=1, per_page=10)

    assert total == 1
    assert len(logs) == 1
    assert logs[0].src_ip == "10.0.0.1"
    assert logs[0].id == "60d0fe4f5311236168a109a2"
    collection.count_documents.assert_called_once()
    collection.find.assert_called_once()


@pytest.mark.asyncio
async def test_get_stats_empty(mock_mongodb):
    """Test get_stats handles empty database gracefully."""
    traffic_service = TrafficService(mock_mongodb)
    collection = mock_mongodb["traffic_logs"]

    mock_agg_cursor = AsyncMock()
    mock_agg_cursor.to_list.return_value = []
    collection.aggregate.return_value = mock_agg_cursor

    stats = await traffic_service.get_stats(hours=24)

    assert stats.total_packets == 0
    assert stats.total_bytes == 0
    assert stats.unique_sources == 0


@pytest.mark.asyncio
async def test_get_stats_success(mock_mongodb):
    """Test get_stats computes aggregates and conversions correctly."""
    traffic_service = TrafficService(mock_mongodb)
    collection = mock_mongodb["traffic_logs"]

    mock_agg_cursor1 = AsyncMock()
    mock_agg_cursor1.to_list.return_value = [{
        "total_packets": 100,
        "total_bytes": 80000,
        "unique_sources": ["192.168.1.1", "192.168.1.2"],
        "unique_destinations": ["8.8.8.8"],
    }]

    mock_agg_cursor2 = AsyncMock()
    mock_agg_cursor2.to_list.return_value = [
        {"_id": "TCP", "count": 80},
        {"_id": "UDP", "count": 20},
    ]

    collection.aggregate.side_effect = [mock_agg_cursor1, mock_agg_cursor2]

    stats = await traffic_service.get_stats(hours=24)

    assert stats.total_packets == 100
    assert stats.total_bytes == 80000
    assert stats.unique_sources == 2
    assert stats.unique_destinations == 1
    assert stats.protocol_distribution["TCP"] == 80
    assert stats.avg_packet_size == 800.0


@pytest.mark.asyncio
async def test_ingest_packets_success(mock_mongodb):
    """Test successful ingestion of traffic logs."""
    traffic_service = TrafficService(mock_mongodb)
    collection = mock_mongodb["traffic_logs"]

    mock_insert_result = MagicMock()
    mock_insert_result.inserted_ids = [1, 2, 3]
    collection.insert_many = AsyncMock(return_value=mock_insert_result)

    packets_list = [
        {"src_ip": "10.0.0.1", "dst_ip": "1.1.1.1", "protocol": "TCP"},
        {"src_ip": "10.0.0.2", "dst_ip": "8.8.8.8", "protocol": "UDP"},
        {"src_ip": "10.0.0.3", "dst_ip": "9.9.9.9", "protocol": "ICMP"},
    ]

    count = await traffic_service.ingest_packets(packets_list)

    assert count == 3
    collection.insert_many.assert_called_once()
