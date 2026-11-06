import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class MailService {
    private readonly resend: Resend;

    constructor(private readonly configService: ConfigService) {
        this.resend = new Resend(
            this.configService.getOrThrow<string>('RESEND_API_KEY'),
        );
    }

    async sendEmail(
        to: string,
        subject: string,
        html: string,
    ) {
        const { data, error } = await this.resend.emails.send({
            from: this.configService.getOrThrow<string>('MAIL_FROM'),
            to,
            subject,
            html,
        });

        if (error) {
            throw new Error(`Email sending failed: ${error.message}`);
        }

        return data;
    }


    
    async sendPasswordResetEmail(to: string, resetUrl: string) {
        return this.sendEmail(
            to,
            'Réinitialisation de votre mot de passe LuegoCine',
            passwordResetTemplate(resetUrl),
        );
    }
}