from fastapi import APIRouter
import psutil
import socket

from data.traffic_data import network_stats

router = APIRouter()


@router.get("/network/live")
def get_live_network():
    return network_stats


@router.get("/network/interfaces")
def get_interfaces():

    interfaces = []

    stats = psutil.net_if_stats()
    addrs = psutil.net_if_addrs()

    for name in stats:

        ip = ""
        mac = ""

        if name in addrs:
            for addr in addrs[name]:

                if addr.family == socket.AF_INET:
                    ip = addr.address

                elif str(addr.family) == "AddressFamily.AF_PACKET" or addr.family == psutil.AF_LINK:
                    mac = addr.address

        interfaces.append({
            "name": name,
            "status": "Up" if stats[name].isup else "Down",
            "speed": stats[name].speed,
            "ip": ip,
            "mac": mac
        })

    return interfaces

@router.get("/network/connections")
def get_connections():

    connections = []

    try:
        for conn in psutil.net_connections(kind="inet")[:100]:

            local = ""
            remote = ""

            if conn.laddr:
                local = f"{conn.laddr.ip}:{conn.laddr.port}"

            if conn.raddr:
                remote = f"{conn.raddr.ip}:{conn.raddr.port}"

            connections.append({
                "local": local,
                "remote": remote,
                "status": conn.status,
                "pid": conn.pid
            })

    except Exception:
        pass

    return connections