import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import Traffic from "./pages/Traffic";
import Workflow from "./pages/Workflow";
import AttackVisualization from "./pages/AttackVisualization";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
function App(){

return(

<Routes>

<Route path="/" element={<Login/>}/>

<Route path="/dashboard" element={<Dashboard/>}/>

<Route path="/datasets" element={<Datasets/>}/>

<Route path="/traffic" element={<Traffic/>}/>

<Route path="/workflow" element={<Workflow/>}/>
<Route
    path="/attack-visualization"
    element={<AttackVisualization />}
/>

<Route path="/alerts" element={<Alerts />}/>

<Route path="/settings" element={<Settings/>}/>

<Route path="*" element={<Navigate to="/dashboard"/>}/>

</Routes>

);

}

export default App;