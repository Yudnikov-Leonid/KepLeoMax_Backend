import bcrypt from 'bcrypt';
import { users } from '../db/users';

export const createNewUser = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    // check duplicates
    const duplicate = users.find(person => person.email === email);
    if (duplicate) {
        return res.status(409).json({ message: `User with email ${email} is alredy exists` });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {email: email, password: hashedPassword};
        users.push(newUser);

        //console.log(`New users list: ${users.map(person => `${person.email} ${person.password}`)}`);
        res.status(201).json({success: `New user ${email} created`});
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    const foundUser = users.find(person => person.email === email);
    if (!foundUser) {
        return res.status(401).json({ message: `User with email ${email} was not found` });
    }

    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        res.status(200).json({success: `User ${email} is logged in!`});
    } else {
        res.status(401).json({message: 'Password is incorrect'});
    }
}