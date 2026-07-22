import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/Traffic.css";

function Traffic() {
  const [traffic, setTraffic] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const[sortBy,setSortBy]=useState("id");
  const[sortOrder,setSortOrder]=useState("asc");
  const [label, setLabel] = useState("");
  const [labels, setLabels] = useState([]);
  useEffect(() => {
    fetchTraffic(search,page,label,sortBy,sortOrder);
    fetchLabels();
  }, [page,sortBy,sortOrder]);

  const fetchTraffic = async (
  value = "",
  pageNumber = 1,
  selectedLabel = "",
  sortColumn="id",
  order="asc"
) => {
  try {
    const response = await API.get("/traffic", {
      params: {
        search: value,
        page: pageNumber,
        label: selectedLabel,
        sort_by: sortColumn,
        sort_order: order,
      },
    });


   

    setTraffic(response.data);
  } catch (error) {
    console.log(error);
  }
};

 const fetchLabels = async () => {
  try {
    const response = await API.get("/traffic/labels");
    setLabels(response.data);
  } catch (error) {
    console.log(error);
  }
};

const handleSort = (column) => {
  let newOrder = "asc";

  if (sortBy === column && sortOrder === "asc") {
    newOrder = "desc";
  }

  setSortBy(column);
  setSortOrder(newOrder);
  setPage(1);

  fetchTraffic(search, 1, label, column, newOrder);
};
  return (
    <div className="traffic-page">
      <h1>Network Traffic</h1>
      <div className="search-box">
        <input
           type="text"
           placeholder="Search by Port, Protocol or Label..."
           value={search}
           onChange={(e) => {
            const value=e.target.value;
           setSearch(value);
           setPage(1);
           fetchTraffic(value,1,label);
           }}
          />
         <select
  value={label}
  onChange={(e) => {
    setLabel(e.target.value);
    setPage(1);
    fetchTraffic(search, 1, e.target.value, sortBy, sortOrder);
  }}
>
  <option value="">All Traffic</option>

  {labels.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
</select>
      </div>

      <table className="traffic-table">
        <thead>
          <tr>
            <th>#</th>
            <th onClick={() => handleSort("destination_port")}>
                 Destination Port {sortBy === "destination_port" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
            </th>

            <th onClick={() => handleSort("protocol")}>
                Protocol {sortBy === "protocol" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
            </th>

            <th onClick={() => handleSort("flow_duration")}>
               Flow Duration {sortBy === "flow_duration" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
            </th>

            <th onClick={() => handleSort("label")}>
               Label {sortBy === "label" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
            </th>
          </tr>
        </thead>

        <tbody>
          {traffic.map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{row.destination_port}</td>
              <td>{row.protocol}</td>
              <td>{row.flow_duration}</td>
              <td>{row.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Traffic;