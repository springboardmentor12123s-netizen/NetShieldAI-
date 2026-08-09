import { useEffect, useState } from "react";
import axios from "axios";

function DatasetTable(){

const [summary,setSummary]=useState(null);

useEffect(()=>{

axios.get("http://127.0.0.1:5000/api/dataset/summary")
.then(res=>setSummary(res.data));

},[]);

if(!summary)
return <p style={{color:"white"}}>Loading...</p>;

return(

<table>

<thead>

<tr>

<th>Dataset</th>

<th>Rows</th>

<th>Features</th>

</tr>

</thead>

<tbody>

{

summary.datasets.map((d,index)=>(

<tr key={index}>

<td>{d.name}</td>

<td>{d.rows.toLocaleString()}</td>

<td>{d.features}</td>

</tr>

))

}

</tbody>

</table>

)

}

export default DatasetTable;