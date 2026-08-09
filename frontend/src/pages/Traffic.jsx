import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Traffic(){

return(

<div className="dashboard">

<Sidebar/>

<div className="main">

<Navbar/>

<h1 style={{color:"white"}}>📡 Live Traffic Monitoring</h1>

<p style={{color:"#8b949e"}}>
Real-time network monitoring will be displayed here.
</p>

</div>

</div>

)

}

export default Traffic;