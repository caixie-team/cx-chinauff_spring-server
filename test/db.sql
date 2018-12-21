--
-- ******* 集福 *******
--
DROP TABLE IF EXISTS `picker_activity_blessing`;
CREATE TABLE `picker_activity_blessing` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date NOT NULL COMMENT '结束日期',
  `total` int(11) NOT NULL COMMENT '发放总数',
  `last_quantity` int(11) NOT NULL COMMENT '剩余数量',
  `percentage` varchar(20) DEFAULT NULL COMMENT '占比(0.3)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='集福表';

DROP TABLE IF EXISTS `picker_activity_user_blessing`;
CREATE TABLE `picker_activity_user_blessing` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `uid` BIGINT(20)  NOT NULL COMMENT '用户ID',
  `blessing_code` varchar(100) NOT NULL COMMENT '福码(用来标识生产一个福字)',
  `u_shi` varchar(100) NOT NULL COMMENT '礻码',
  `u_yi` varchar(100) NOT NULL COMMENT '一码',
  `u_kou` varchar(100) NOT NULL COMMENT '口码',
  `u_tian` varchar(100) NOT NULL COMMENT '田码',
  `status` int(11)  NOT NULL COMMENT '福码状态(1:待预约 2:待兑换 3:已兑换)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户集福表';

DROP TABLE IF EXISTS `picker_activity_user_shi`;
CREATE TABLE `picker_activity_user_shi` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `uid` BIGINT(20)  NOT NULL COMMENT '用户ID',
  `shi_code` varchar(100) NOT NULL COMMENT '礻码(用来标识生产一个礻字)',
  `status` int(11)  NOT NULL COMMENT '礻码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户礻码表';

DROP TABLE IF EXISTS `picker_activity_user_yi`;
CREATE TABLE `picker_activity_user_yi` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `uid` BIGINT(20)  NOT NULL COMMENT '用户ID',
  `yi_code` varchar(100) NOT NULL COMMENT '一码(用来标识生产一个一字)',
  `status` int(11)  NOT NULL COMMENT '一码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户一码表';

DROP TABLE IF EXISTS `picker_activity_user_kou`;
CREATE TABLE `picker_activity_user_kou` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `uid` BIGINT(20)  NOT NULL COMMENT '用户ID',
  `kou_code` varchar(100) NOT NULL COMMENT '口码(用来标识生产一个口字)',
  `status` int(11)  NOT NULL COMMENT '一码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户口码表';

DROP TABLE IF EXISTS `picker_activity_user_tian`;
CREATE TABLE `picker_activity_user_tian` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `uid` BIGINT(20)  NOT NULL COMMENT '用户ID',
  `tian_code` varchar(100) NOT NULL COMMENT '田码(用来标识生产一个田字)',
  `status` int(11)  NOT NULL COMMENT '一码状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户田码表';


--
-- ******* 优惠券 *******
--

DROP TABLE IF EXISTS `picker_activity_coupon`;
CREATE TABLE `picker_activity_coupon` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `coupon_name` varchar(100) NOT NULL COMMENT '优惠券名称(10元现金券)',
  `coupon_code` varchar(100) DEFAULT NULL COMMENT '券码(第三方提供)',
  `total` int(11) NOT NULL COMMENT '发放库存',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='优惠券表';

DROP TABLE IF EXISTS `picker_activity_coupon_cycle`;
CREATE TABLE `picker_activity_coupon_cycle` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `coupon_id` BIGINT(20)  NOT NULL COMMENT '优惠券ID',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date NOT NULL COMMENT '结束日期',
  `total` int(11) NOT NULL COMMENT '发放总数',
  `last_quantity` int(11) NOT NULL COMMENT '剩余数量',
  `percentage` varchar(20) DEFAULT NULL COMMENT '占比(0.12)',
  `stock_mark` int(11)  NOT NULL COMMENT '库存标识(1:主库存 2:备用库存)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='发券周期表';

DROP TABLE IF EXISTS `picker_activity_user_coupon`;
CREATE TABLE `picker_activity_user_coupon` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `uid` BIGINT(20)  NOT NULL COMMENT '用户ID',
  `coupon_id` BIGINT(20) NOT NULL COMMENT '优惠券ID',
  `status` int(11)  NOT NULL COMMENT '使用状态(1:未使用 2:已使用)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户优惠券表';









