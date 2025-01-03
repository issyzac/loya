
import React, {useContext, createContext} from 'react';

const AppContext = createContext();

export function useAppState() {
  return useContext(AppContext);
}

export function AppProvider({children}) {

    const state = {
        pageStatus: {
          currentPage: 'home',
        },
    };

  const actions = {
      setPageStatus: (status) => {
        state.pageStatus.currentPage = status;
      }
    };

    return (
    <AppContext.Provider value={{state, actions}}>
      {children}
    </AppContext.Provider>
    );
}

