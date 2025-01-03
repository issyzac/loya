// import { Button } from "@headlessui/react";
// import React, {useState} from "react";
// import logo from "../assets/e-nzi-01.png";
// import { useUpdateUser } from "../providers/UserProvider";
// import axios from 'axios';

// //1-1-2025

// export default function Login() {


//     const  [phoneNumber, setPhoneNumber] =  useState('');

//     const setUser = useUpdateUser();

//     const  handleChange = (event) => {
//         setPhoneNumber(event.target.value);
//         console.log(phoneNumber);
//     };

//     const handleSubmit = (event) => {
//         event.preventDefault();
        
//         axios.get(`http://5.180.149.168:5001/api/customers/search?phone_number=`+phoneNumber)
//             .then(res => {
//                 console.log("Response Code:   "+res.status);
//                 if (res.status === 200){
//                     //user found
//                     const usr = res.data.customer;
//                     setUser(usr);
//                 }
//             })    
//             .catch (function (error){
//                 console.log('User not found');
//             });

//     }

//     return (
//       <>
//         <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 mt-30">
//           <div className="w-full max-w-sm space-y-10">
//             <div mt-20>
//               <img
//                 alt="Enzi Coffee"
//                 src={logo}
//                 className="mx-auto h-21 w-auto"
//               />
//               <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
//                 Use your phone number to sign in
//               </h2>
//             </div>
//             <form className="space-y-6"
//               onSubmit={handleSubmit}>
//               <div>
//                 <div className="col-span-2">
//                   <input
//                     id="phone_number"
//                     name="Phone Number"
//                     type="phone_number"
//                     required
//                     placeholder="Phone Number"
//                     autoComplete="phone_number"
//                     aria-label="Phone Number"
//                     className="
//                         block w-full rounded-t-md bg-white px-3 py-1.5 
//                         text-base text-gray-900 outline outline-1 -outline-offset-1 
//                         outline-gray-300 placeholder:text-gray-400 focus:relative 
//                         focus:outline focus:outline-2 focus:-outline-offset-2 
//                         focus:outline-indigo-600 sm:text-sm/6"

//                         value={phoneNumber} onChange={handleChange}

//                   />
//                 </div>
//               </div>
//               <div>
//                 <Button
//                   type="submit"
//                   className="
//                     flex w-full justify-center 
//                     rounded-md bg-[#b58150] 
//                     px-3 py-1.5 text-sm/6 font-semibold 
//                     text-white hover:bg-[#1f2a44] 
//                     focus-visible:outline focus-visible:outline-2 
//                     focus-visible:outline-offset-2 focus-visible:outline-indigo-600
//                     font-family: 'Poiret One' "
//                     >
//                   Sign in
//                 </Button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </>
//     )
//   }
  