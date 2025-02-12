import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function SearchResults() {
    const [results, setResults] = useState();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                console.log(searchParams);
              const response = await axios.get(`${import.meta.env.VITE_API}/search`, {params: searchParams});
              setResults(response.data);
              console.log(response.data);
            } catch (err: any) {
              const error = err as Error;
              console.error(error.message || 'An error occurred');
            }
          };

          fetchResults();
        
    }, [searchParams]);
    
    return (
        <div>

        </div>
    );
}

export default SearchResults;