import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {

    @IsEmail({}, { message: "L'adresse email de connexion est invalide." })
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    email: string;

    @IsString({
    message: 'Le mot de passe doit etre une chaine de caracteres.',
    })
    @MinLength(4, {
    message: 'Le mot de passe doit contenir au moins 4 caracteres.',
    })
    password: string;
}



