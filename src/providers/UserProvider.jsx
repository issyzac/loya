import React, { useState, createContext, useContext, useEffect } from 'react';

const UserContext = createContext();
const UserUpdateContext = createContext();

const RegistrationStatusContext = createContext();
const RegistrationStatusUpdateContext = createContext();

const CustomerReceiptsContext = createContext();
const CustomerReceiptsUpdateContext = createContext();

const NewUserNumberContext = createContext();
const UpdateNewUserNumberContext = createContext();

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

export function useNewUserNumber() {
    return React.useContext(NewUserNumberContext);
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

export function useUpdateNewUserNumber() {
    return React.useContext(UpdateNewUserNumberContext);
}   

export function UserProvider({ children }){

    //Customer Receipts List
    let receipts = [];

    const [user, setUser] = useState({});

    const [registrationStatus, setRegistrationStatus] = useState(true);

    const [newUserNumber, setNewUserNumber] = useState("");

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

    function updateNewUserNumber(newUserNumber){
        setNewUserNumber(newUserNumber);
    }
  
   return (
     <UserContext.Provider value={user}>
        <UserUpdateContext.Provider value={updateUser}>
            <RegistrationStatusContext.Provider value={registrationStatus}>
                <RegistrationStatusUpdateContext.Provider value={updateRegistrationStatus}>
                    <CustomerReceiptsContext.Provider value={customerReceipts}>
                        <CustomerReceiptsUpdateContext.Provider value={updateCustomerReceipts}>
                            <NewUserNumberContext.Provider value={newUserNumber}>
                                <UpdateNewUserNumberContext.Provider value={updateNewUserNumber}>
                                    {children}
                                </UpdateNewUserNumberContext.Provider>
                            </NewUserNumberContext.Provider>
                        </CustomerReceiptsUpdateContext.Provider>
                    </CustomerReceiptsContext.Provider>
                </RegistrationStatusUpdateContext.Provider>   
            </RegistrationStatusContext.Provider>
        </UserUpdateContext.Provider>
     </UserContext.Provider>
   );
  }

  