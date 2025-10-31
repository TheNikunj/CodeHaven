import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500,"Something went Wrong in generating tokens");
    }
};

const registerUser= asyncHandler( async (req,res)=>{
    const {username,fullname,email,password}=req.body;
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    });
    if(existedUser)return res.status(400).json(new ApiResponse(400,null,"User already exists"));
    const user=await User.create({fullname,email,password,username,avatar:'https://res.cloudinary.com/dyyta5lri/image/upload/v1724514263/defaultuser_l0d3kk.png'});
    const createUser= await User.findById(user._id).select("-password -refreshToken");
    if(!createUser)return res.status(400).json(new ApiResponse(400,null,"Server Error"));
    return res.status(200).json(new ApiResponse(200,createUser,"Registered Successfully"))
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        // Validate user exists
        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }
        
        // Validate password
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Invalid email or password');
        }
        
        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        
        // Get user data without sensitive information
        const loggedInUser = await User.findById(user._id).select('-password -refreshToken');
        
        // Set cookie options
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        };

        // Send response with tokens
        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken
                    },
                    'User logged in successfully'
                )
            );
    } catch (error) {
        console.error('Login error:', error);
        throw new ApiError(error.statusCode || 500, error.message || 'Login failed');
    }
});

const logoutUser= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken:1
            }
        },
        {new : true}
    )

    const options={
        httpOnly:true,          
        secure:true ,       
        sameSite:'strict'
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out Successfully"))
});

const refreshAccessToken=asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken)return res.status(400).json(new ApiResponse(400, null, "Refresh token is missing"));
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id);
        if(!user || incomingRefreshToken!==user?.refreshToken)
        {   
            return res.status(401).json(new ApiResponse(401, null, "Invalid or expired refresh token"));
        }
        const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
        const options={
            httpOnly:true,          
            secure:true ,         
            sameSite: 'Strict'
        }
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,{accessToken,refreshToken},"ACCESS TOKEN REFRESHED SUCCESSFULLY"))
    } catch (error) {
        return res.status(404).json(new ApiResponse(401,{},"plz logout"));
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) return res.status(400).json(new ApiResponse(400, null, "User not authenticated"));

    const curruser = await User.aggregate([
        {
            $match: {
                username: req.user.username
            }
        },
        {
            $lookup: {
                from: 'submissions',
                localField: '_id',
                foreignField: 'madeBy',
                as: 'mySubmissions',
                pipeline: [
                    {
                        $match: {
                            status: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'problems',
                            localField: 'problem',
                            foreignField: '_id',
                            as: 'problemDetails',
                            pipeline: [
                                {
                                    $project: {
                                        difficulty: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            difficulty: {
                                $first: "$problemDetails.difficulty"
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$problem",
                            submissions: { $push: "$$ROOT" }
                        }
                    },
                    {
                        $lookup: {
                            from: 'problems',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'problemDetails'
                        }
                    },
                    {
                        $unwind: "$problemDetails"
                    },
                    {
                        $addFields: {
                            difficulty: "$problemDetails.difficulty"
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: 'tweets',
                localField: '_id',
                foreignField: 'owner',
                as: 'mytweets',
            }
        },
        {
            $addFields: {
                easyCount: {
                    $size: {
                        $filter: {
                            input: "$mySubmissions",
                            as: "submission",
                            cond: { $eq: ["$$submission.difficulty", "easy"] }
                        }
                    }
                },
                mediumCount: {
                    $size: {
                        $filter: {
                            input: "$mySubmissions",
                            as: "submission",
                            cond: { $eq: ["$$submission.difficulty", "medium"] }
                        }
                    }
                },
                hardCount: {
                    $size: {
                        $filter: {
                            input: "$mySubmissions",
                            as: "submission",
                            cond: { $eq: ["$$submission.difficulty", "hard"] }
                        }
                    }
                }
            }
        }
    ]);

    if (curruser?.length == 0) return res.status(400).json(new ApiResponse(400, {}, "User Does Not exist"));

    return res.status(200).json(new ApiResponse(200, curruser[0], "User Fetched Successfully"));
});


const updateAvatar =asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const user=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password");
    return res.status(200).json(new ApiResponse(200,user,"Avatar updated Successfully"));
});

const setdefaultlang = asyncHandler(async (req, res) => {
    if (!req.user)return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    const {lang}=req.params;
    try {
        const newuser = await User.findByIdAndUpdate(req.user._id,
            {
                default_language: lang
            },
            {new:true});
        if (!newuser)return res.status(500).json(new ApiResponse(500, null, "Server error"));
        return res.status(200).json(new ApiResponse(200, newuser, "Default language updated"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Server error"));
    }
    });

const settemplate = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    const {lang}=req.params;
    const {code} = req.body;
    try {
        const newuser = await User.findByIdAndUpdate(req.user._id, 
            {
                $set: {
                    [`template.${lang}`]: code
                }
            }
        , { new: true });
        if (!newuser) return res.status(500).json(new ApiResponse(500, null, "Server error"));
        return res.status(200).json(new ApiResponse(200, newuser, "Template updated"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Server error"));
    }
});

const gettemplateandlang = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    try {
        const data = await User.findById(req.user?._id).select("template default_language");
        if (!data) return res.status(500).json(new ApiResponse(500, null, "Server error"));
        return res.status(200).json(new ApiResponse(200, data, "Template and Language fetched"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Server error"));
    }
});

export {registerUser,loginUser,logoutUser,refreshAccessToken,getCurrentUser,updateAvatar,setdefaultlang,settemplate,gettemplateandlang};