import { Controller, Post, Get, Body, Query } from '@nestjs/common'
import { WechatAuthService } from './wechat-auth.service'

@Controller('auth/wechat')
export class WechatAuthController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}

  // 获取微信登录二维码
  @Get('qrcode')
  async getQRCode() {
    return await this.wechatAuthService.generateQRCode()
  }

  // 微信授权回调
  @Post('callback')
  async handleCallback(@Body('code') code: string) {
    return await this.wechatAuthService.handleAuthCallback(code)
  }

  // 检查微信绑定状态
  @Get('check-bind')
  async checkBind(@Query('openid') openid: string) {
    return await this.wechatAuthService.checkBindStatus(openid)
  }
}
