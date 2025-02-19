import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Grid from "../components/Grid";
import { getErrorMessage, Workbook } from "../utils/workbookUtils";
import SearchBar from "../components/Searchbar";

function SearchResults() {
    const [results, setResults] = useState<Workbook[] | null>(null);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const fetchResults = async () => {
            try {
              console.log(searchParams);
              const response = await axios.get(`${import.meta.env.VITE_API}/search`, {params: searchParams});
              console.log(response);
              setResults(response.data);
            } catch (err: unknown) {
              console.error(getErrorMessage(err));
            }
          };

          fetchResults();
        
    }, [searchParams]);
    
    return (
        <div>
          <h2 className="text-3xl font-bold text-left">Search Results</h2>
          <br/>
          <SearchBar/>
          <br/>
          {(results && results.length > 0) ? <Grid workbooks={results} /> : <p>No search results found.</p>}
        </div>
    );
}

export default SearchResults;