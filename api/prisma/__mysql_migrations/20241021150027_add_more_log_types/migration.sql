-- AlterTable
ALTER TABLE `Shop` MODIFY `color` ENUM('RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'TEAL') NULL;

-- AlterTable
ALTER TABLE `logs` MODIFY `type` ENUM('USER_LOGIN', 'USER_CREATED', 'SHOP_CREATED', 'USER_CONNECTED_TO_SHOP', 'USER_DISCONNECTED_FROM_SHOP', 'USER_SHOP_ROLE_CHANGED') NOT NULL;
