import { IsEmail, IsNotEmpty, IsString, Length, } from 'class-validator';

export class CreateUserDto {
    @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
    @IsNotEmpty({ message: 'Le nom est obligatoire.' })
    @Length(2, 100, {
        message: 'Le nom doit contenir entre 2 et 100 caractères.',
    })
    nom: string;

    @IsString({ message: 'Le nom d\'utilisateur doit être une chaîne de caractères.' })
    @IsNotEmpty({ message: 'Le nom d\'utilisateur est obligatoire.' })
    @Length(2, 100, {
        message: 'Le nom d\'utilisateur doit contenir entre 2 et 100 caractères.',
    })
    nomUtilisateur: string;

    @IsEmail({}, {
        message: "L'adresse e-mail est invalide.",
    })
    email: string;

    @IsString()
    @IsNotEmpty({
        message: 'Le mot de passe est obligatoire.',
    })
    @Length(6, 100, {
        message:
        'Le mot de passe doit contenir au moins 6 caractères.',
    })
    password: string;

}

