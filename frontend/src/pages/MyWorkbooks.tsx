import SearchBar from "../components/Searchbar";
import Carousel from "../components/Carousel";

function MyWorkbooks() {
    let workbooks = [
        {id:1, content:"Workbook 1"},
        {id:2, content:"Workbook 2"}
    ]

    return (
        <>
        <h1>My Workbooks</h1>

        <SearchBar/>
        <Carousel items={workbooks}/>
        </>
    );
}

export default MyWorkbooks