import React, {useState} from "react";

import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { Button } from "@headlessui/react";
import logo from "../assets/e-nzi-01.png";

import axiosInstance from "../api/axios";

import { useNewUserNumber, useRegistrationStatus, useUpdateCustomerReceipts, useUpdateNewUserNumber, useUpdateRegistrationStatus, useUpdateUser } from "../providers/UserProvider";

export default function Register() {

const registrationStatus = useRegistrationStatus();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 mt-30">
        <div className="space-y-10 divide-y divide-gray-900/10">
            <div className="mt-20">
                <img
                alt="Your Company"
                src={logo}
                className="mx-auto h-20"
                />
                <div className="mx-2 sm:mx-4 lg:mx-8">
                    <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 "> Use your phone number to sign in </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                <h2 className="text-base/7 font-semibold text-gray-900">Start Tracking Your Visists</h2>
                <p className="mt-1 text-sm/6 text-gray-600">Register to track your Enzi visits and earn prises</p>
                </div>
                {  registrationStatus === true ? <LoginForm /> : <RegisterForm /> }
            </div>
    </div>
</div>
  )
}

function RegisterForm(){

    const updateRegistrationStatus = useUpdateRegistrationStatus();

    const setUser = useUpdateUser();

    const newUserNumber = useNewUserNumber();

    const  [names, setNames] =  useState('');

    const  [email, setEmail] =  useState('');

    const  [phoneNumber, setPhoneNumber] =  useState('');

    const  [city, setCity] =  useState('');

    const  [nickName, setNickName] =  useState('');

    const  handleChange = (event) => {
        if (event.target.id === 'names'){
            setNames(event.target.value);
        }else if (event.target.id === 'email'){
            setEmail(event.target.value);
        }
        else if (event.target.id === 'phone_number'){
            setPhoneNumber(event.target.value);
        }
        else if (event.target.id === 'nick-name'){
            setNickName(event.target.value);
        }
    };

    const validateInputs = () => {
        
        if(city === ""){
            setCity("Dar es Salaam");
        }
        
        if(phoneNumber === ""){
            setPhoneNumber(newUserNumber);
        }

        if (email === ""){
            setEmail("noemail@enzi.coffee");
        }


        if (nickName === ""){
            setNickName(names);
        }

    }

    const handleSubmit = async (event) => {

        event.preventDefault();

        validateInputs();

        try {
            const result = await axiosInstance.post("/api/customers/register", 
                {
                    "name": names,
                    "email": email? email : "noemail@enzi.coffee",
                    "phone_number": phoneNumber,
                    //"nickname": nickName? nickName : names,
                    "city": city ? city : "Dar es Salaam",
                    "date_of_birth": "2022-10-19",
                    "region": "North",
                    "total_points": 10 //Registration Points
                }
            ).then(res => {
                    console.log("Response Code:   "+res.status);
                    if (res.status === 201){
                        //user found
                        const usr = res.data.customer;
                        setUser(usr);
                        fetchReceipts();
                    }
                })    
                .catch ((error) => {
                    updateRegistrationStatus(false);
                    console.log('Error Registering User');
                });

        console.log("Result from post ", result.data);

        } catch (error){
            console.log("Error posting "+error);
        }
    }

    const fetchReceipts = (customerId) => {

        axiosInstance.get("/api/receipts/search?customer_id="+customerId)
        .then(res => {
                console.log("Response Code:   "+res.status);
            })    
            .catch (function (error){
                updateRegistrationStatus(false);
                console.log('Error Registering User');
            });
    }

    return(
        <form 
            className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2"
            onSubmit={handleSubmit} >
            <div className="px-4 py-6 sm:p-8">
                <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="col-span-4">
                    <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                        Names
                    </label>
                    <div className="mt-2">
                    <input
                        id="names"
                        name="first-name"
                        type="text"
                        required
                        autoComplete="given-name"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        onChange={handleChange}
                    />
                    </div>
                </div>

                <div className="col-span-4">
                    <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                    Email address
                    </label>
                    <div className="mt-2">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        onChange={handleChange}
                    />
                    </div>
                </div>

                <div className="col-span-4">
                    <label htmlFor="phone_number" className="block text-sm/6 font-medium text-gray-900">
                    Phone Number
                    </label>
                    <div className="mt-2">
                    <input
                        id="phone_number"
                        name="Phone Number"
                        type="tel"
                        pattern="[0-9]*"
                        required
                        autoComplete="phone_number"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 
                        outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 
                        focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"

                        placeholder={newUserNumber ? newUserNumber : ''}   onChange={handleChange}
                    />
                    </div>
                </div>

                <div className="sm:col-span-3 hidden">
                    <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900">
                    Country
                    </label>
                    <div className="mt-2 grid grid-cols-1">
                    <select
                        id="country"
                        name="country"
                        autoComplete="country-name"
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    >
                        <option>United States</option>
                        <option>Canada</option>
                        <option>Mexico</option>
                    </select>
                    <ChevronDownIcon
                        aria-hidden="true"
                        className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    />
                    </div>
                </div>

                <div className="col-span-4 hidden">
                    <label htmlFor="nick-name" className="block text-sm/6 font-medium text-gray-900">
                        Nickname
                    </label>
                    <div className="mt-2">
                    <input
                        id="nick-name"
                        name="nick-name"
                        type="text"
                        autoComplete="nick-name"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        onChange={handleChange}
                    />
                    </div>
                </div>
            </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                <button type="button" className="text-sm/6 font-semibold text-gray-900"
                    onClick={() => updateRegistrationStatus(true)}>
                    Cancel
                </button>
                <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Save
                </button>
            </div>
        </form>
    )
}


function LoginForm(){

    const  [phoneNumber, setPhoneNumber] =  useState('');

    const setUser = useUpdateUser();

    const updateNewUserNumber = useUpdateNewUserNumber();

    const updateRegistrationStatus = useUpdateRegistrationStatus();

    const setCustomerReceipts = useUpdateCustomerReceipts();

    const  handleChange = (event) => {
        console.log(event);
        setPhoneNumber(event.target.value);
        console.log(phoneNumber);
    };

    const handleSubmit = async (event) => {
        
        event.preventDefault();
        
        await axiosInstance.get("/api/customers/search?phone_number="+phoneNumber)
            .then(res => {
                console.log("Response Code:   "+res.status);
                if (res.status === 200){
                    //user found
                    const usr = res.data.customer;
                    setUser(usr);
                    fetchReceipts(usr._id);
                }
            })    
            .catch (function (error){
                updateRegistrationStatus(false);
                updateNewUserNumber(phoneNumber);
                console.log('User not found');
            });

    }

    const fetchReceipts = async (customerId) => {

        await axiosInstance.get("/api/receipts/search?customer_id="+customerId)
        .then(res => {
                console.log("Response is :   "+res.data.receipts[0].points_balance);
                setCustomerReceipts(res.data.receipts);
            })    
            .catch (function (error){
                updateRegistrationStatus(false);
                console.log('Error fetching receipts');
            });
    }

    return(
        <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2"
                      onSubmit={handleSubmit}>
                      <div>
                        <div className="col-span-2">
                          <input
                            id="phone_number"
                            name="Phone Number"
                            type="tel"
                            pattern="[0-9]*"
                            required
                            placeholder="Phone Number"
                            autoComplete="phone_number"
                            aria-label="Phone Number"
                            className="
                                block w-full rounded-t-md bg-white px-3 py-1.5 
                                text-base text-gray-900 outline outline-1 -outline-offset-1 
                                outline-gray-300 placeholder:text-gray-400 focus:relative 
                                focus:outline focus:outline-2 focus:-outline-offset-2 
                                focus:outline-indigo-600 sm:text-sm/6"
        
                                value={phoneNumber} onChange={handleChange}
        
                          />
                        </div>
                      </div>
                      <div>
                        <Button
                          type="submit"
                          className="
                            flex w-full justify-center 
                            rounded-md bg-[#b58150] mt-10
                            px-3 py-1.5 text-sm/6 font-semibold 
                            text-white hover:bg-[#1f2a44] 
                            focus-visible:outline focus-visible:outline-2 
                            focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                            font-family: 'Poiret One' "
                            >
                          Sign in
                        </Button>
                      </div>
                    </form>
    )
}