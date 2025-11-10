const convertUserToSend = (user, req) => {
    if (!user) return null;

    return {id: user.id, email: user.email, username: user.username, profile_image: user.profile_image, is_current: req.userId === user.id};
};

export default convertUserToSend;