from flask import Blueprint, jsonify
from services.dataset_service import DATASET_SUMMARY

dataset = Blueprint("dataset", __name__)

@dataset.route("/dataset/summary", methods=["GET"])
def summary():
    return jsonify(DATASET_SUMMARY)