from flask import Flask
from flask_cors import CORS
from api.dataset import dataset
from api.auth import auth
from api.live import live

app = Flask(__name__)

CORS(app)

app.register_blueprint(auth,url_prefix="/api")
app.register_blueprint(dataset,url_prefix="/api")
app.register_blueprint(live,url_prefix="/api")
@app.route("/")
def home():
    return "NetShield AI Backend Running"

if __name__=="__main__":
    app.run(debug=True)