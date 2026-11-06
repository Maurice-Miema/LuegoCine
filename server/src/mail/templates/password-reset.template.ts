
export function passwordResetTemplate(resetUrl: string): string {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Réinitialisation du mot de passe</title>
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: Arial, Helvetica, sans-serif;
            color: #18181b;
        ">
            <div style="
                display: none;
                max-height: 0;
                overflow: hidden;
                opacity: 0;
            ">
                Réinitialisez votre mot de passe LuegoCine.
            </div>

            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="background-color: #f4f4f5; padding: 40px 15px;"
            >
            <tr>
                <td align="center">

                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                    max-width: 560px;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    "
                >
                    <!-- Header -->
                    <tr>
                    <td style="
                        padding: 28px 35px;
                        border-bottom: 1px solid #eeeeee;
                    ">
                        <div style="
                        font-size: 27px;
                        font-weight: 800;
                        letter-spacing: -1px;
                        color: #000000;
                        ">
                        Luego<span style="color: #ef4444;">Cine</span>
                        </div>
                    </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                    <td style="padding: 38px 35px;">

                        <p style="
                            margin: 0 0 16px;
                            font-size: 15px;
                            line-height: 1.7;
                            color: #52525b;
                        ">
                            Bonjour,
                        </p>

                        <p style="
                            margin: 0 0 24px;
                            font-size: 15px;
                            line-height: 1.7;
                            color: #52525b;
                        ">
                            Nous avons reçu une demande de réinitialisation
                            du mot de passe de votre compte LuegoCine.
                            Pour définir un nouveau mot de passe, cliquez
                            sur le bouton ci-dessous.
                        </p>

                        <table
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            style="margin: 0 0 25px;"
                        >
                            <tr>
                                <td
                                    align="center"
                                    bgcolor="#ef4444"
                                    style="border-radius: 7px;"
                                >
                                    <a
                                        href="${resetUrl}"
                                        target="_blank"
                                        style="
                                        display: inline-block;
                                        padding: 15px 25px;
                                        color: #ffffff;
                                        font-size: 14px;
                                        font-weight: 700;
                                        text-decoration: none;
                                        border-radius: 7px;
                                        "
                                    >
                                        Réinitialiser mon mot de passe
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="
                            margin: 0 0 12px;
                            font-size: 13px;
                            line-height: 1.7;
                            color: #71717a;
                        ">
                            Ce lien est valable pendant <strong>10 minutes</strong>
                            et ne peut être utilisé qu'une seule fois.
                        </p>

                        <div style="
                            padding: 16px;
                            background-color: #fafafa;
                            border-left: 3px solid #ef4444;
                            border-radius: 4px;
                        ">
                            <p style="
                                margin: 0;
                                font-size: 13px;
                                line-height: 1.7;
                                color: #52525b;
                            ">
                                <strong>Vous n'êtes pas à l'origine de cette demande ?</strong>
                                Ignorez cet e-mail. Votre mot de passe actuel
                                restera inchangé.
                            </p>
                        </div>

                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td style="
                        padding: 24px 35px;
                        background-color: #fafafa;
                        border-top: 1px solid #eeeeee;
                        text-align: center;
                    ">
                        <p style="
                        margin: 0 0 8px;
                        font-size: 13px;
                        font-weight: 700;
                        color: #18181b;
                        ">
                        Luego<span style="color: #ef4444;">Cine</span>
                        </p>

                        <p style="
                        margin: 0;
                        font-size: 11px;
                        line-height: 1.6;
                        color: #a1a1aa;
                        ">
                        Cet e-mail a été envoyé automatiquement.
                        Merci de ne pas y répondre.
                        </p>

                        <p style="
                        margin: 12px 0 0;
                        font-size: 11px;
                        color: #a1a1aa;
                        ">
                        © ${new Date().getFullYear()} LuegoCine. Tous droits réservés.
                        </p>
                    </td>
                    </tr>

                </table>

                </td>
            </tr>
            </table>
        </body>
        </html>
    `;
}
