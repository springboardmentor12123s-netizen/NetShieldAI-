from pydantic import BaseModel


class NetworkPacketCreate(BaseModel):
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: int
    status: str = "Normal"