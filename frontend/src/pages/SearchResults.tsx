import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Grid from "../components/Grid";
import { Workbook } from "../utils/workbookUtils";
import SearchBar from "../components/Searchbar";

function SearchResults() {
    const [results, setResults] = useState<Workbook[] | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                console.log(searchParams);
              const response = await axios.get(`${import.meta.env.VITE_API}/search`, {params: searchParams});
              console.log(response);
              setResults(response.data);
            } catch (err: any) {
              const error = err as Error;
              console.error(error.message || 'An error occurred');
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
          <Grid workbooks={results}/>
        </div>
    );
}

export default SearchResults;