import { AppwriteException, ID, Query } from 'appwrite'

import { INewPost, INewUser } from "../../types";
import { account, appwriteConfig, avatars, databases, storage } from './config';

// Create Auth User
export async function createUserAccount(user: INewUser) {
    try {

        // For Auth
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        )

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);

        // For Database
        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            email: newAccount.email,
            name: newAccount.name,
            username: user.username,
            imageUrl: avatarUrl
        });

        console.log("Saved to database")
        return newUser;
    } catch (error) {
        console.log(error);
        return error;
    }
}

// Saves user to DB
export async function saveUserToDB(user: {
    accountId: string,
    email: string,
    name: string,
    imageUrl: URL,
    username?: string
}) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            user,
        )

        return newUser;
    } catch (error) {
        console.log(error)
    }
}
// To sign in account
export async function signInAccount(user: { email: string; password: string }) {
    try {
        // const sessions = await account.getSession('current');
        // console.log('Current session:', sessions);

        const session = await account.createEmailPasswordSession(user.email, user.password)

        return session;
    } catch (error) {
        console.log(error)
    }
}


// To get current users info
export async function getCurrentUser() {

    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;
        // console.log(currentAccount)

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,

            // gets current account Id
            [Query.equal('accountId', currentAccount.$id)]
        )

        if (!currentUser) throw Error;

        console.log("Got current User:", currentUser)


        return currentUser.documents[0];
    } catch (error) {
        console.log(error,"current user not found");
    }
}

export async function signOutAccount() {
    try {
        console.log("Sign out")
        const session = await account.deleteSession("current")
        
        return session;
    } catch (error) {
        console.log(error)
    }
}

export async function createPost(post: INewPost) {
    try {
        //Upload image to storage
        const uploadedFile = await uploadFile(post.file[0]);

        if (!uploadedFile) throw Error

        //Get file url
        const fileUrl = getFilePreview(uploadedFile.$id)
        // Extract the URL from the response

        if (!fileUrl) {
            deleteFile(uploadedFile.$id);
            throw Error;
        }

        //Convert tags in array
        const tags = post.tags?.replace(/ /g, "").split(",") || [];

        //save post to database
        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postsCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            }
        );

        if (!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error;
        }

        return newPost;
    }
    catch (error) {
        console.log(error)
    }
}

export async function uploadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        );

        return uploadedFile
    }
    catch (error) {
        console.log(error)
    }
}

export function getFilePreview(fileId: string) {
    try {
      const fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
  
      if (!fileUrl) throw Error;
  
      return fileUrl;
    } catch (error) {
      console.log(error);
    }
  }

export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(appwriteConfig.storageId, fileId)

        return { status: "ok" }
    }
    catch (error) {
        console.log(error)
    }
}

export async function getRecentPosts(){
    const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postsCollectionId,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
    )

    if(!posts) throw Error;

    return posts;
}

export async function likePost(postId: string, likesArray:string[]){
    try{
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postsCollectionId,
            postId,
            {
                likes: likesArray
            }
        )

        if(!updatedPost) throw Error;

        return updatedPost;
    }
    catch(error){
        console.log(error)
    }
}

export async function savePost(postId: string, userId: string){
    try{
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            ID.unique(),
            {
                user: userId,
                post: postId
            }
        )

        if(!updatedPost) throw Error;

        return updatedPost;
    }
    catch(error){
        console.log(error)
    }
}

export async function deleteSavedPost(savedRecordId: string){
    try{
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            savedRecordId
        )

        if(!statusCode) throw Error;

        return { status: 'Ok'};
    }
    catch(error){
        console.log(error)
    }
}