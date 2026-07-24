import time

FLOW_TIMEOUT = 5


def get_expired_flows(flows):

    now = time.time()

    expired = []

    for key, flow in list(flows.items()):

        if now - flow.last_seen >= FLOW_TIMEOUT:

            expired.append((key, flow))

    return expired