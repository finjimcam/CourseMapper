import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from "axios";

function Workbook() {
    let { workbook_id } = useParams();

    useEffect(() => {
        axios.get(`http://127.0.0.1:8000/workbook/`, { params: { workbook_id } })
            .then(response => {
                console.log(response)
            })
            .catch(error => {
                console.log(error);
            });
    }, []);

    return <></>
}

export default Workbook