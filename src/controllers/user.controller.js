import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
