from sqlalchemy.orm import Session

from app.models.network_packet import NetworkPacket
from app.schemas.network_schema import NetworkPacketCreate


def create_packet(db: Session, packet: NetworkPacketCreate):

    new_packet = NetworkPacket(
        source_ip=packet.source_ip,
        destination_ip=packet.destination_ip,
        protocol=packet.protocol,
        packet_size=packet.packet_size,
        status=packet.status
    )

    db.add(new_packet)
    db.commit()
    db.refresh(new_packet)

    return new_packet


def get_all_packets(db: Session):
    return (
        db.query(NetworkPacket)
        .order_by(NetworkPacket.id.desc())
        .limit(200)
        .all()
    )


def get_packet_by_id(db: Session, packet_id: int):
    return db.query(NetworkPacket).filter(
        NetworkPacket.id == packet_id
    ).first()


def delete_packet(db: Session, packet_id: int):

    packet = db.query(NetworkPacket).filter(
        NetworkPacket.id == packet_id
    ).first()

    if packet is None:
        return False

    db.delete(packet)
    db.commit()

    return True
