
import React, {useContext, createContext, useState} from 'react';

const CurrentPageContext = createContext();
const UpdateCurrentPageContext = createContext();

export function useCurrentPage() {
  return useContext(CurrentPageContext);
}

export function useUpdateCurrentPage(){
  return useContext(UpdateCurrentPageContext);
}

export function AppProvider({children}) {

  let page = "Home";

  const [currentPage, setCurrentPage] = useState(page);

  function updateCurrentPage(page) {
    setCurrentPage(page);
  }

  return (
    <CurrentPageContext.Provider value={currentPage}>
      <UpdateCurrentPageContext.Provider value={updateCurrentPage}>
        {children}
      </UpdateCurrentPageContext.Provider>
    </CurrentPageContext.Provider>
  );
}

