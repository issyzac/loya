import React, { useState, createContext, useContext, useEffect } from 'react';

const UserContext = createContext();
const UserUpdateContext = createContext();
const RegistrationStatusContext = createContext();
const RegistrationStatusUpdateContext = createContext();
const CustomerReceiptsContext = createContext();
const CustomerReceiptsUpdateContext = createContext();

//User Hook
export function useUser() {
  return React.useContext(UserContext);;
}

//Update User Hook
export function useUpdateUser() {
    return React.useContext(UserUpdateContext);
}

export function useRegistrationStatus() {
    return React.useContext(RegistrationStatusContext);
}

export function useUpdateRegistrationStatus() {
    return React.useContext(RegistrationStatusUpdateContext);
}

export function useCustomerReceipts() {
    return React.useContext(CustomerReceiptsContext);
}

export function useUpdateCustomerReceipts() {
    return React.useContext(CustomerReceiptsUpdateContext);
}

export function UserProvider({ children }){

    //Customer Receipts List
    let receipts = [];

    let loginAttemptNumber = 0;

    const [user, setUser] = useState({});

    const [registrationStatus, setRegistrationStatus] = useState(true);

    const [customerReceipts, setCustomerReceipts] = useState(receipts);

    function updateUser(user) {
        setUser(user);
    }

    function updateRegistrationStatus(status){
        setRegistrationStatus(status);
    }

    function updateCustomerReceipts(receipts){
        setCustomerReceipts(receipts);
    }
  
   return (
     <UserContext.Provider value={user}>
        <UserUpdateContext.Provider value={updateUser}>
            <RegistrationStatusContext.Provider value={registrationStatus}>
                <RegistrationStatusUpdateContext.Provider value={updateRegistrationStatus}>
                    <CustomerReceiptsContext.Provider value={customerReceipts}>
                        <CustomerReceiptsUpdateContext.Provider value={updateCustomerReceipts}>
                            {children}
                        </CustomerReceiptsUpdateContext.Provider>
                    </CustomerReceiptsContext.Provider>
                </RegistrationStatusUpdateContext.Provider>   
            </RegistrationStatusContext.Provider>
        </UserUpdateContext.Provider>
     </UserContext.Provider>
   );
  }

  