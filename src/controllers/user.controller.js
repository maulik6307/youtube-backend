import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  // get Use details from frontend
  // validation on details
  // check for images and avatar
  // upload them on cloudinary
  // create user object and make entry in db
  // remove password and refresh token from db response
  // return res

  // console.log("req.body :", req.body);

  //=>

  /* 
req.body : [Object: null prototype] {
  fullName: 'maulik patel',
  email: 'maulik@test.com',
  password: '12345678',
  username: 'maulik'
}
*/

  const { username, email, fullName, password } = req.body;

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "user is already exists");
  }

  // console.log("req.files :", req.files);

  //=>
  /* 
req.files : [Object: null prototype] {    
  avatar: [
    {
      fieldname: 'avatar',
      originalname: 'logout_ic.svg',      
      encoding: '7bit',
      mimetype: 'image/svg+xml',
      destination: './public/temp',       
      filename: 'logout_ic.svg',
      path: 'public\\temp\\logout_ic.svg',
      size: 267
    }
  ],
  coverImage: [
    {
      fieldname: 'coverImage',
      originalname: 'arrow_ic.svg',
      encoding: '7bit',
      mimetype: 'image/svg+xml',
      destination: './public/temp',
      filename: 'arrow_ic.svg',
      path: 'public\\temp\\arrow_ic.svg',
      size: 449
    }
  ]
}
*/

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log("avart from cloudinary :", avatar);

  //=>
  /*
  avart from cloudinary : {
  asset_id: '62c480094f13a6c235f9c01c2ece8d5b',
  public_id: 'pc9qqxumivsfcilurkrq',
  version: 1723795012,
  version_id: '3723f9a13954ccbf333d6dd4efdaf6f3',
  signature: 'c24326bcfb9ad6a83a6733d284dfad48654b83a5',
  width: 18,
  height: 18,
  format: 'svg',
  resource_type: 'image',
  created_at: '2024-08-16T07:56:52Z',
  tags: [],
  bytes: 267,
  type: 'upload',
  etag: '97a849e7725db4ef7e2ba4b2b9ce7448',
  placeholder: false,
  url: 'http://res.cloudinary.com/dzoi2g4mi/image/upload/v1723795012/pc9qqxumivsfcilurkrq.svg',
  secure_url: 'https://res.cloudinary.com/dzoi2g4mi/image/upload/v1723795012/pc9qqxumivsfcilurkrq.svg',
  asset_folder: '',
  display_name: 'pc9qqxumivsfcilurkrq',
  original_filename: 'logout_ic',
  api_key: '581971854361822'
}
  */

  // console.log("coverImage from cloudinary :", coverImage);

  //=>
  /*
  coverImage from cloudinary : {
  asset_id: '59c20671b974d7c785529b4effca6484',
  public_id: 'vhxpdvw9atsvebd9sbmb',
  asset_id: '59c20671b974d7c785529b4effca6484',
  public_id: 'vhxpdvw9atsvebd9sbmb',
  public_id: 'vhxpdvw9atsvebd9sbmb',
  version: 1723795014,
  version_id: '712445b975cfb3db59071166d550e8c5',
  signature: '565cc0a14bb4202d486e1da3fa81a8da46736e39',
  width: 16,
  height: 25,
  format: 'svg',
  resource_type: 'image',
  created_at: '2024-08-16T07:56:54Z',
  tags: [],
  bytes: 449,
  type: 'upload',
  etag: '1fe215636438905b754fcf1d8d4d41e7',
  placeholder: false,
  url: 'http://res.cloudinary.com/dzoi2g4mi/image/upload/v1723795014/vhxpdvw9atsvebd9sbmb.svg',
  secure_url: 'https://res.cloudinary.com/dzoi2g4mi/image/upload/v1723795014/vhxpdvw9atsvebd9sbmb.svg',
  asset_folder: '',
  display_name: 'vhxpdvw9atsvebd9sbmb',
  original_filename: 'arrow_ic',
  api_key: '581971854361822'
}
  */

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong !! while registering user ");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User registered successfully 🤩"));
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //take login credential from the user
  //req.body => data => username or email && password
  //check password is correct or not for that user
  //generate accessToken and refreshToken
  //send accessToken and refreshToken in to cookies to User
  //user successfully logedIn

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email required field!!");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log("user :", user);

  if (!user) {
    throw new ApiError(404, "User not found 😫!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password Invalid ⨂");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req?.user._id,
    {
      refreshToken: undefined,
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Expired refresh token or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refersh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user get successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  req.status(200).json(new ApiResponse(200, user, "Update successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    res.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Avatar Updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover image");
  }

  const user = await User.findByIdAndUpdate(
    res.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "subscribers",
        },
        channelsCount: {
          $size: "subscribed",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  console.log("channel ::", channel);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exits");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel found successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "WatchHistory founded successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
