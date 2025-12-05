const convertUserToSend = (user, req) => {
    if (!user) return null;

    const isCurrent = req.userId === user.id;

    return { id: user.id, email: user.email, username: user.username, profile_image: user.profile_image, is_current: isCurrent };
    // fcm_tokens: isCurrent ? user.fcm_tokens : undefined
};

export default convertUserToSend;