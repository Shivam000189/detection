import express from 'express';


import axios from 'axios';


export const preditionCrime = async (req, res) => {
    try{
        const response = await axios.post("http://localhost:5001/predict-crime", req.body)
        res.json(response.data);
    }catch(error){
        res.status(400).json({msg:"prediction server error"});
    }
}
