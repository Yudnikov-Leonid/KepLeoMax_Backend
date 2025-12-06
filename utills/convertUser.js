const convertUserToSend = (user, req) => {
    if (!user) return null;

    const isCurrent = req.userId === user.id;

    return { id: user.id, username: user.username, profile_image: user.profile_image, is_current: isCurrent };
};

export default convertUserToSend;