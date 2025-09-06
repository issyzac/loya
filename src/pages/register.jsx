import React, {useState} from "react";

import { ChevronDownIcon, UserPlusIcon, PhoneIcon } from '@heroicons/react/16/solid'
import { Button } from "@headlessui/react";
import logo from "../assets/e-nzi-01.png";

import axiosInstance from "../api/axios";

import { useNewUserNumber, useRegistrationStatus, useUpdateCustomerReceipts, useUpdateNewUserNumber, useUpdateRegistrationStatus, useUpdateUser } from "../providers/UserProvider";

export default function Register() {

const registrationStatus = useRegistrationStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <img
                alt="Enzi Coffee"
                src={logo}
                className="mx-auto h-24 w-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Welcome to Enzi Coffee
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {registrationStatus === true 
                ? "Welcome back! Sign in with your phone number to continue tracking your visits." 
                : "Join our loyalty program and start earning rewards with every visit to Enzi Coffee."
              }
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Info Panel */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    {registrationStatus === true ? (
                      <PhoneIcon className="h-6 w-6" style={{color: '#B47744'}} />
                    ) : (
                      <UserPlusIcon className="h-6 w-6" style={{color: '#B47744'}} />
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {registrationStatus === true ? "Quick Sign In" : "Start Your Journey"}
                  </h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {registrationStatus === true 
                    ? "Enter your registered phone number to access your account and view your loyalty points and visit history."
                    : "Create your account to start tracking your Enzi Coffee visits, earn points, and unlock exclusive rewards."
                  }
                </p>
                
                {!registrationStatus && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#B47744'}}></div>
                      <span>Earn 10 points on registration</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#B47744'}}></div>
                      <span>Track your visit history</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#B47744'}}></div>
                      <span>Redeem points for rewards</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {registrationStatus === true ? <LoginForm /> : <RegisterForm />}
            </div>
          </div>
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

    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(true);

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
        } finally {
            setIsSubmitting(false);
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
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden">
            <div className="px-6 py-4" style={{background: 'linear-gradient(to right, #B47744, #C8956D)'}}>
                <h3 className="text-xl font-semibold text-white">Create Your Account</h3>
                <p className="text-orange-100 text-sm mt-1">Fill in your details to get started</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {/* Full Name Field */}
                    <div className="space-y-2">
                        <label htmlFor="names" className="block text-sm font-medium text-gray-900">
                            Full Name *
                        </label>
                        <input
                            id="names"
                            name="first-name"
                            type="text"
                            required
                            autoComplete="given-name"
                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 transition-colors duration-200 sm:text-sm"
                            style={{'--tw-ring-color': '#B47744'}}
                            onFocus={(e) => e.target.style.borderColor = '#B47744'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            placeholder="Enter your full name"
                            value={names}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 transition-colors duration-200 sm:text-sm"
                            onFocus={(e) => e.target.style.borderColor = '#B47744'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            placeholder="Enter your email (optional)"
                            value={email}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-gray-500">Optional - helps us send you special offers</p>
                    </div>

                    {/* Phone Number Field */}
                    <div className="space-y-2">
                        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-900">
                            Phone Number *
                        </label>
                        <input
                            id="phone_number"
                            name="Phone Number"
                            type="tel"
                            pattern="[0-9]*"
                            required
                            autoComplete="phone_number"
                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 transition-colors duration-200 sm:text-sm"
                            onFocus={(e) => e.target.style.borderColor = '#B47744'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            placeholder={newUserNumber ? newUserNumber : 'Enter your phone number'}
                            value={phoneNumber}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-gray-500">We'll use this to track your visits and send updates</p>
                    </div>

                    {/* Hidden Fields */}
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

                {/* Form Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-100">
                    <button 
                        type="button" 
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        onClick={() => updateRegistrationStatus(true)}
                    >
                        Already have an account? Sign in
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !names.trim()}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        style={{
                            background: isSubmitting || !names.trim() ? '#9ca3af' : 'linear-gradient(to right, #B47744, #C8956D)',
                            '--tw-ring-color': '#B47744'
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting && names.trim()) {
                                e.target.style.background = 'linear-gradient(to right, #A0673A, #B8824F)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSubmitting && names.trim()) {
                                e.target.style.background = 'linear-gradient(to right, #B47744, #C8956D)'
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <UserPlusIcon className="w-4 h-4 mr-2" />
                                Create Account
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}


function LoginForm(){

    const  [phoneNumber, setPhoneNumber] =  useState('');

    const setUser = useUpdateUser();

    const updateNewUserNumber = useUpdateNewUserNumber();

    const updateRegistrationStatus = useUpdateRegistrationStatus();

    const setCustomerReceipts = useUpdateCustomerReceipts();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const  handleChange = (event) => {
        console.log(event);
        setPhoneNumber(event.target.value);
        console.log(phoneNumber);
    };

    const handleSubmit = async (event) => {
        
        event.preventDefault();
        setIsSubmitting(true);
        
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
            })
            .finally(() => {
                setIsSubmitting(false);
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
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden">
            <div className="px-6 py-4" style={{background: 'linear-gradient(to right, #B47744, #C8956D)'}}>
                <h3 className="text-xl font-semibold text-white">Welcome Back</h3>
                <p className="text-orange-100 text-sm mt-1">Enter your phone number to sign in</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                    {/* Phone Number Field */}
                    <div className="space-y-2">
                        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-900">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="phone_number"
                                name="Phone Number"
                                type="tel"
                                pattern="[0-9]*"
                                required
                                placeholder="Enter your registered phone number"
                                autoComplete="phone_number"
                                aria-label="Phone Number"
                                className="block w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-0 transition-colors duration-200 sm:text-sm"
                                onFocus={(e) => e.target.style.borderColor = '#B47744'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                value={phoneNumber} 
                                onChange={handleChange}
                            />
                        </div>
                        <p className="text-xs text-gray-500">Enter the phone number you used to register</p>
                    </div>

                    {/* Form Actions */}
                    <div className="space-y-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || !phoneNumber.trim()}
                            className="w-full inline-flex items-center justify-center rounded-xl px-8 py-4 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            style={{
                                background: isSubmitting || !phoneNumber.trim() ? '#9ca3af' : 'linear-gradient(to right, #B47744, #C8956D)',
                                '--tw-ring-color': '#B47744'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting && phoneNumber.trim()) {
                                    e.target.style.background = 'linear-gradient(to right, #A0673A, #B8824F)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting && phoneNumber.trim()) {
                                    e.target.style.background = 'linear-gradient(to right, #B47744, #C8956D)'
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    <PhoneIcon className="w-4 h-4 mr-2" />
                                    Sign In
                                </>
                            )}
                        </button>
                        
                        <div className="text-center">
                            <button 
                                type="button" 
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                                onClick={() => updateRegistrationStatus(false)}
                            >
                                Don't have an account? Create one
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
