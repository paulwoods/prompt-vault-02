package com.mrpaulwoods.promptvault.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
@Profile("test")
public class TestMailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl() {
            @Override
            public void send(SimpleMailMessage simpleMessage) throws MailException {
                // No-op: suppress actual email sending in tests
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) throws MailException {
                // No-op
            }
        };
        sender.setHost("localhost");
        sender.setPort(25);
        return sender;
    }
}
