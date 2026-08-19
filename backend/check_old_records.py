import asyncio

from app.database import predictions_collection, alerts_collection


async def main():
    prediction_count = await predictions_collection.count_documents(
        {"attack_type": "attack"}
    )

    alert_count = await alerts_collection.count_documents(
        {"attack_type": "attack"}
    )

    print("Records that would be removed:")
    print("Predictions:", prediction_count)
    print("Alerts:", alert_count)

    print("\nValid attack types currently supported:")

    for attack_type in ["ddos", "portscan", "bruteforce", "botnet", "normal"]:
        predictions = await predictions_collection.count_documents(
            {"attack_type": attack_type}
        )

        alerts = await alerts_collection.count_documents(
            {"attack_type": attack_type}
        )

        print(
            f"{attack_type}: predictions={predictions}, alerts={alerts}"
        )


if __name__ == "__main__":
    asyncio.run(main())