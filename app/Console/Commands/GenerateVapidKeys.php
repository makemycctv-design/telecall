<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateVapidKeys extends Command
{
    protected $signature = 'telecrm:vapid';

    protected $description = 'Generate a VAPID public/private key pair for Web Push';

    public function handle(): int
    {
        if (! class_exists(\Minishlink\WebPush\VAPID::class)) {
            $this->error('minishlink/web-push is not installed. Run: composer require minishlink/web-push');

            return self::FAILURE;
        }

        $keys = \Minishlink\WebPush\VAPID::createVapidKeys();

        $this->info('Add these to your .env file:');
        $this->line('VAPID_PUBLIC_KEY='.$keys['publicKey']);
        $this->line('VAPID_PRIVATE_KEY='.$keys['privateKey']);

        return self::SUCCESS;
    }
}
