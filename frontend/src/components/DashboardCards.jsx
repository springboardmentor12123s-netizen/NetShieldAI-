import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboardcards.css";

function DashboardCards() {

    const [live, setLive] = useState({

        packets: 0,

        connections: 0,

        upload: 0,

        download: 0,

        status: "Monitoring"

    });

    useEffect(() => {

        const fetchLive = () => {

            axios
                .get("http://127.0.0.1:5000/api/live")
                .then((res) => {

                    setLive(res.data);

                })
                .catch((err) => console.log(err));

        };

        fetchLive();

        const interval = setInterval(fetchLive,1000);

        return ()=>clearInterval(interval);

    },[]);


    const cards=[

        {

            icon:"📦",

            title:"Packets / sec",

            value:live.packets,

            color:"#00D4FF"

        },

        {

            icon:"🌐",

            title:"Connections",

            value:live.connections,

            color:"#7C3AED"

        },

        {

            icon:"📥",

            title:"Download",

            value:`${live.download} MB/s`,

            color:"#22c55e"

        },

        {

            icon:"📤",

            title:"Upload",

            value:`${live.upload} MB/s`,

            color:"#f59e0b"

        }

    ];



    return (

        <div className="cards">

            {cards.map((card,index)=>(

                <div

                    key={index}

                    className="card"

                    style={{

                        borderTop:`4px solid ${card.color}`

                    }}

                >

                    <div className="card-top">

                        <span className="icon">

                            {card.icon}

                        </span>

                        <small>

                            {card.title}

                        </small>

                    </div>

                    <h2>

                        {card.value}

                    </h2>

                </div>

            ))}

        </div>

    );

}

export default DashboardCards;