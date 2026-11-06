
import {
    IsString,
    IsStrongPassword,
    MinLength,
} from 'class-validator';

export class ResetPasswordDto {
    @IsString()
    @MinLength(64)
    token: string;

    @IsString()
    @IsStrongPassword()
    newPassword: string;
}



