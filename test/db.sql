--
-- ******* 集福 *******
--
DROP TABLE IF EXISTS `picker_activity_blessing`;
CREATE TABLE `picker_activity_blessing` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL COMMENT '福字(礻)',
  `blessing_type` int(11) NOT NULL COMMENT '福类型(1:礻 2:一 3:口 4:田)',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date NOT NULL COMMENT '结束日期',
  `total` int(11) NOT NULL COMMENT '发放总数',
  `last_quantity` int(11) NOT NULL COMMENT '剩余数量',
  `percentage` varchar(20) DEFAULT NULL COMMENT '占比(0.3)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='集福表';

DROP TABLE IF EXISTS `picker_activity_blessing_pool`;
CREATE TABLE `picker_activity_blessing_pool` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL COMMENT '福字(礻)',
  `blessing_type` int(11) NOT NULL COMMENT '福类型(1:礻 2:一 3:口 4:田)',
  `blessing_id` BIGINT(20)  NOT NULL DEFAULT 0 COMMENT '福字ID',
  `release_time` datetime NOT NULL COMMENT '释放时间',
  `last_quantity` int(11) NOT NULL COMMENT '剩余数量',
  `code` varchar(100) NOT NULL COMMENT '字福码(用来标识生产一个字福码)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='福池表';

DROP TABLE IF EXISTS `picker_activity_user_blessing`;
CREATE TABLE `picker_activity_user_blessing` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `wx_uid` BIGINT(20)  NOT NULL COMMENT '微信用户ID',
  `blessing_code` varchar(100) NOT NULL COMMENT '福码(用来标识生产一个福字)',
  `shi_code` varchar(100) NOT NULL COMMENT '礻码',
  `yi_code` varchar(100) NOT NULL COMMENT '一码',
  `kou_code` varchar(100) NOT NULL COMMENT '口码',
  `tian_code` varchar(100) NOT NULL COMMENT '田码',
  `status` int(11)  NOT NULL COMMENT '福码状态(1:待预约 2:待兑换 3:已兑换)',
  `exchange_time` datetime DEFAULT NULL COMMENT '兑换时间',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户集福表';

DROP TABLE IF EXISTS `picker_activity_user_shi`;
CREATE TABLE `picker_activity_user_shi` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `wx_uid` BIGINT(20)  NOT NULL DEFAULT 0 COMMENT '微信用户ID',
  `shi_code` varchar(100) NOT NULL COMMENT '礻码(用来标识生产一个礻字)',
  `status` int(11)  NOT NULL COMMENT '礻码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户礻码表';

DROP TABLE IF EXISTS `picker_activity_user_yi`;
CREATE TABLE `picker_activity_user_yi` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `wx_uid` BIGINT(20)  NOT NULL DEFAULT 0 COMMENT '微信用户ID',
  `yi_code` varchar(100) NOT NULL COMMENT '一码(用来标识生产一个一字)',
  `status` int(11)  NOT NULL COMMENT '一码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户一码表';

DROP TABLE IF EXISTS `picker_activity_user_kou`;
CREATE TABLE `picker_activity_user_kou` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `wx_uid` BIGINT(20)  NOT NULL DEFAULT 0 COMMENT '微信用户ID',
  `kou_code` varchar(100) NOT NULL COMMENT '口码(用来标识生产一个口字)',
  `status` int(11)  NOT NULL COMMENT '一码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户口码表';

DROP TABLE IF EXISTS `picker_activity_user_tian`;
CREATE TABLE `picker_activity_user_tian` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `wx_uid` BIGINT(20)  NOT NULL DEFAULT 0 COMMENT '微信用户ID',
  `tian_code` varchar(100) NOT NULL COMMENT '田码(用来标识生产一个田字)',
  `status` int(11)  NOT NULL COMMENT '一码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户田码表';

DROP TABLE IF EXISTS `picker_activity_help`;
CREATE TABLE `picker_activity_help` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `be_wx_uid` BIGINT(20)  NOT NULL DEFAULT 0 COMMENT '被助力者微信用户ID',
  `wx_uid` BIGINT(20)  NOT NULL DEFAULT 0 COMMENT '助力者的微信用户ID',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='友好助力表';


--
-- ******* 优惠券 *******
--

DROP TABLE IF EXISTS `picker_activity_coupon`;
CREATE TABLE `picker_activity_coupon` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `coupon_name` varchar(100) NOT NULL COMMENT '优惠券名称(10元现金券)',
  `type_code` varchar(45) DEFAULT NULL COMMENT '类型编号',
  `total` int(11) NOT NULL COMMENT '发放库存',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date NOT NULL COMMENT '结束日期',
  `stock_mark` int(11)  NOT NULL COMMENT '库存标识(1:主库存 2:备用库存)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='优惠券表';

DROP TABLE IF EXISTS `picker_activity_card`;
CREATE TABLE `picker_activity_card` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `card_name` varchar(100) NOT NULL COMMENT '充值卡名称(50元会员充值卡)',
  `card_type` varchar(45) DEFAULT NULL COMMENT '充值卡类型',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='充值卡表';

DROP TABLE IF EXISTS `picker_activity_coupon_pool`;
CREATE TABLE `picker_activity_coupon_pool` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `coupon_id` BIGINT(20)  NOT NULL COMMENT '优惠券ID',
  `last_quantity` int(11) NOT NULL COMMENT '剩余数量',
  `release_time` DATETIME DEFAULT NULL COMMENT '释放时间',
  `stock_mark` int(11)  NOT NULL COMMENT '库存标识(1:主库存 2:备用库存)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='优惠券池表';

DROP TABLE IF EXISTS `picker_activity_coupon_user`;
CREATE TABLE `picker_activity_coupon_user` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `openid` VARCHAR(45)  NOT NULL COMMENT '微信用户ID',
  `coupon_id` BIGINT(20) NOT NULL COMMENT '优惠券ID',
  `status` int(11)  NOT NULL COMMENT '使用状态(1:未使用 2:已使用)',
  `receive_time` datetime DEFAULT NULL COMMENT '领取时间',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户优惠券表';

DROP TABLE IF EXISTS `picker_activity_card_user`;
CREATE TABLE `picker_activity_card_user` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `openid` VARCHAR(45)  NOT NULL COMMENT '微信用户ID',
  `coupon_id` BIGINT(20) NOT NULL COMMENT '优惠券ID',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '收件地址',
  `receive_time` datetime DEFAULT NULL COMMENT '领取时间',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户充值卡表';









