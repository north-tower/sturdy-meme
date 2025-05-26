import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(phoneNumber: string, pin: string): Promise<any> {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    if (user && (await bcrypt.compare(pin, user.pin))) {
      const { pin, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      phoneNumber: user.phoneNumber,
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validatePin(userId: string, pin: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return bcrypt.compare(pin, user.pin);
  }
} 