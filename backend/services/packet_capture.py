import psutil
import time

from data.traffic_data import network_stats


def start_sniffing():

    previous = psutil.net_io_counters()

    while True:

        current = psutil.net_io_counters()

        network_stats["bytes_sent"] = current.bytes_sent
        network_stats["bytes_recv"] = current.bytes_recv

        network_stats["packets_sent"] = current.packets_sent
        network_stats["packets_recv"] = current.packets_recv

        network_stats["packets"] = (
            current.packets_sent +
            current.packets_recv
        )

        network_stats["upload_speed"] = (
            current.bytes_sent -
            previous.bytes_sent
        )

        network_stats["download_speed"] = (
            current.bytes_recv -
            previous.bytes_recv
        )

        network_stats["active_connections"] = len(
            psutil.net_connections()
        )

        interfaces = psutil.net_if_stats()

        network_stats["interfaces_up"] = sum(
            1
            for interface in interfaces.values()
            if interface.isup
        )

        previous = current

        time.sleep(1)