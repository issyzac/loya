import React, { useState, createContext, useContext, useEffect } from 'react';

const UserContext = createContext();
const UserUpdateContext = createContext();

const RegistrationStatusContext = createContext();
const RegistrationStatusUpdateContext = createContext();

const CustomerReceiptsContext = createContext();
const CustomerReceiptsUpdateContext = createContext();

const NewUserNumberContext = createContext();
const UpdateNewUserNumberContext = createContext();

// Staff Authentication Contexts
const StaffUserContext = createContext();
const StaffUserUpdateContext = createContext();
const StaffTokenContext = createContext();
const StaffTokenUpdateContext = createContext();
const StaffRefreshTokenContext = createContext();
const StaffRefreshTokenUpdateContext = createContext();
const StaffPermissionsContext = createContext();
const StaffPermissionsUpdateContext = createContext();
const StaffAuthStatusContext = createContext();
const StaffAuthStatusUpdateContext = createContext();

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

// Staff Authentication Hooks
export function useStaffUser() {
    return React.useContext(StaffUserContext);
}

export function useUpdateStaffUser() {
    return React.useContext(StaffUserUpdateContext);
}

export function useStaffToken() {
    return React.useContext(StaffTokenContext);
}

export function useUpdateStaffToken() {
    return React.useContext(StaffTokenUpdateContext);
}

export function useStaffAuthStatus() {
    return React.useContext(StaffAuthStatusContext);
}

export function useUpdateStaffAuthStatus() {
    return React.useContext(StaffAuthStatusUpdateContext);
}

export function useStaffRefreshToken() {
    return React.useContext(StaffRefreshTokenContext);
}

export function useUpdateStaffRefreshToken() {
    return React.useContext(StaffRefreshTokenUpdateContext);
}

export function useStaffPermissions() {
    return React.useContext(StaffPermissionsContext);
}

export function useUpdateStaffPermissions() {
    return React.useContext(StaffPermissionsUpdateContext);
}   

export function UserProvider({ children }){

    //Customer Receipts List
    let receipts = [];

    const [user, setUser] = useState({});

    const [registrationStatus, setRegistrationStatus] = useState(true);

    const [newUserNumber, setNewUserNumber] = useState("");

    const [customerReceipts, setCustomerReceipts] = useState(receipts);

    // Staff Authentication State
    const [staffUser, setStaffUser] = useState(() => {
        const savedUser = localStorage.getItem('staffUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [staffToken, setStaffToken] = useState(() => {
        return localStorage.getItem('staffToken') || null;
    });

    const [staffAuthStatus, setStaffAuthStatus] = useState(() => {
        return !!localStorage.getItem('staffToken');
    });

    const [staffRefreshToken, setStaffRefreshToken] = useState(() => {
        return localStorage.getItem('staffRefreshToken') || null;
    });

    const [staffPermissions, setStaffPermissions] = useState(() => {
        const savedPermissions = localStorage.getItem('staffPermissions');
        return savedPermissions ? JSON.parse(savedPermissions) : [];
    });

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

    // Staff Authentication Functions
    function updateStaffUser(staffUser) {
        setStaffUser(staffUser);
        if (staffUser) {
            localStorage.setItem('staffUser', JSON.stringify(staffUser));
        } else {
            localStorage.removeItem('staffUser');
        }
    }

    function updateStaffToken(token) {
        setStaffToken(token);
        if (token) {
            localStorage.setItem('staffToken', token);
            setStaffAuthStatus(true);
        } else {
            localStorage.removeItem('staffToken');
            setStaffAuthStatus(false);
        }
    }

    function updateStaffAuthStatus(status) {
        setStaffAuthStatus(status);
    }

    function logoutStaff() {
        updateStaffUser(null);
        updateStaffToken(null);
        updateStaffRefreshToken(null);
        updateStaffPermissions([]);
        updateStaffAuthStatus(false);
    }

    function updateStaffRefreshToken(token) {
        setStaffRefreshToken(token);
        if (token) {
            localStorage.setItem('staffRefreshToken', token);
        } else {
            localStorage.removeItem('staffRefreshToken');
        }
    }

    function updateStaffPermissions(permissions) {
        setStaffPermissions(permissions);
        if (permissions && permissions.length > 0) {
            localStorage.setItem('staffPermissions', JSON.stringify(permissions));
        } else {
            localStorage.removeItem('staffPermissions');
        }
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
                                    <StaffUserContext.Provider value={staffUser}>
                                        <StaffUserUpdateContext.Provider value={updateStaffUser}>
                                            <StaffTokenContext.Provider value={staffToken}>
                                                <StaffTokenUpdateContext.Provider value={updateStaffToken}>
                                                    <StaffRefreshTokenContext.Provider value={staffRefreshToken}>
                                                        <StaffRefreshTokenUpdateContext.Provider value={updateStaffRefreshToken}>
                                                            <StaffPermissionsContext.Provider value={staffPermissions}>
                                                                <StaffPermissionsUpdateContext.Provider value={updateStaffPermissions}>
                                                                    <StaffAuthStatusContext.Provider value={staffAuthStatus}>
                                                                        <StaffAuthStatusUpdateContext.Provider value={updateStaffAuthStatus}>
                                                                            {children}
                                                                        </StaffAuthStatusUpdateContext.Provider>
                                                                    </StaffAuthStatusContext.Provider>
                                                                </StaffPermissionsUpdateContext.Provider>
                                                            </StaffPermissionsContext.Provider>
                                                        </StaffRefreshTokenUpdateContext.Provider>
                                                    </StaffRefreshTokenContext.Provider>
                                                </StaffTokenUpdateContext.Provider>
                                            </StaffTokenContext.Provider>
                                        </StaffUserUpdateContext.Provider>
                                    </StaffUserContext.Provider>
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

  