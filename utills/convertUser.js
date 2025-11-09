const convertUserToSend = (user) => {
    if (!user) return null;

    return {id: user.id, email: user.email, username: user.username, profile_image: user.profile_image};
};

export default convertUserToSend;