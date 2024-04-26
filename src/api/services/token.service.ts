import {sign} from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {UserRepository} from '../repository/user/user.repository';
import {IUser} from '../../database/interfaces/user.interface';
dotenv.config();
class TokenService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  create = async (userId: mongoose.Types.ObjectId): Promise<string> => {
    try {
      const accessToken = this.generateJwtToken(
        {
          userId: userId,
        },
        process.env.jwtKey!
      );
      return accessToken;
    } catch (err) {
      throw new Error('Something went wrong while creating token' + err);
    }
  };
  private generateJwtToken(payload: {}, jwtKey: string): string {
    const token = sign(payload, jwtKey, {
      expiresIn: process.env.jwtExpire,
    });
    return token;
  }

  async validateToken(token: string, userId: string) {
    const user = await this.userRepository.getById<IUser>(userId, '+token');
    return user?.jwtToken === token ? user : null;
  }

  createVerifyToken = async (email: string) => {
    try {
      const accessToken = this.generateJwtToken(
        {
          email: email,
        },
        process.env.verifyKey!
      );
      return accessToken;
    } catch (err) {
      throw new Error('Something went wrong while creating token' + err);
    }
  };
}

export default TokenService;
