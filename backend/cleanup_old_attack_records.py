import asyncio

from app.database import predictions_collection, alerts_collection


async def main():
    prediction_result = await predictions_collection.delete_many(
        {"attack_type": "attack"}
    )

    alert_result = await alerts_collection.delete_many(
        {"attack_type": "attack"}
    )

    print("Cleanup completed.")
    print("Predictions deleted:", prediction_result.deleted_count)
    print("Alerts deleted:", alert_result.deleted_count)

    remaining_predictions = await predictions_collection.count_documents(
        {"attack_type": "attack"}
    )

    remaining_alerts = await alerts_collection.count_documents(
        {"attack_type": "attack"}
    )

    print("Remaining generic predictions:", remaining_predictions)
    print("Remaining generic alerts:", remaining_alerts)


if __name__ == "__main__":
    asyncio.run(main())