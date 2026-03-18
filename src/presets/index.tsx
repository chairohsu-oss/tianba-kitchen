import { useLaunch } from '@tarojs/taro';
import { PropsWithChildren, useState, useEffect } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import { Lock, Check, X } from 'lucide-react-taro';
import { Network } from '@/network';
import { injectH5Styles } from './h5-styles';
import { devDebug } from './dev-debug';
import { H5Container } from './h5-container';

export const Preset = ({ children }: PropsWithChildren) => {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; nickname: string; avatarUrl: string; verified: boolean; role: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  useLaunch(() => {
    devDebug();
    injectH5Styles();
  });

  // 检查用户验证状态
  useEffect(() => {
    checkUserVerification();
  }, []);

  const checkUserVerification = async () => {
    try {
      const result = await Network.request({ url: '/api/users/me' });
      const user = (result as any).data?.data;
      if (user) {
        setCurrentUser(user);
        // 如果用户未验证，显示验证弹窗
        if (!user.verified) {
          setShowVerifyModal(true);
        }
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) {
      setVerifyResult({ success: false, message: '请输入验证码' });
      return;
    }

    if (!currentUser) {
      setVerifyResult({ success: false, message: '用户信息获取失败' });
      return;
    }

    setVerifying(true);
    try {
      const result = await Network.request({
        url: '/api/users/verify',
        method: 'POST',
        data: { userId: currentUser.id, code: verifyCode.trim() }
      });
      
      const data = (result as any).data;
      if (data.code === 200 && data.data) {
        setVerifyResult({ success: true, message: '验证成功！' });
        setCurrentUser(data.data);
        setTimeout(() => {
          setShowVerifyModal(false);
        }, 1500);
      } else {
        setVerifyResult({ success: false, message: data.msg || '验证失败' });
      }
    } catch (error) {
      console.error('验证失败', error);
      setVerifyResult({ success: false, message: '验证失败，请重试' });
    } finally {
      setVerifying(false);
    }
  };

  // 跳过验证（作为客人使用）
  const handleSkip = () => {
    setShowVerifyModal(false);
  };

  if (TARO_ENV === 'h5') {
    return (
      <H5Container>
        {children}
        {showVerifyModal && <VerificationModal />}
      </H5Container>
    );
  }

  return (
    <>
      {children}
      {showVerifyModal && <VerificationModal />}
    </>
  );

  function VerificationModal() {
    return (
      <View 
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <View 
          className="bg-white rounded-2xl w-11/12 max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题 */}
          <View className="px-6 py-5 border-b border-gray-100">
            <View className="flex flex-row items-center justify-center gap-2">
              <Lock size={24} color="#F97316" />
              <Text className="text-lg font-bold text-gray-800">身份验证</Text>
            </View>
            <Text className="block text-center text-sm text-gray-500 mt-2">
              天霸私厨仅限家庭成员使用
            </Text>
          </View>

          {/* 内容 */}
          <View className="px-6 py-5">
            <Text className="block text-sm text-gray-600 mb-4">
              请输入家庭成员验证码以解锁完整功能
            </Text>

            {/* 验证码输入 */}
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <Input
                className="w-full text-center text-lg font-mono"
                placeholder="请输入验证码"
                value={verifyCode}
                onInput={(e) => setVerifyCode(e.detail.value)}
                maxlength={20}
              />
            </View>

            {/* 验证结果提示 */}
            {verifyResult && (
              <View className={`flex flex-row items-center justify-center gap-2 py-2 rounded-lg mb-4 ${verifyResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                {verifyResult.success ? (
                  <Check size={16} color="#22C55E" />
                ) : (
                  <X size={16} color="#EF4444" />
                )}
                <Text className={`text-sm ${verifyResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {verifyResult.message}
                </Text>
              </View>
            )}

            {/* 验证按钮 */}
            <Button
              className={`w-full rounded-xl py-3 font-medium ${verifying ? 'bg-gray-300' : 'bg-orange-500'}`}
              onClick={handleVerify}
              disabled={verifying}
            >
              <Text className="text-white">{verifying ? '验证中...' : '验证身份'}</Text>
            </Button>

            {/* 跳过按钮 */}
            <View className="mt-3 flex items-center justify-center" onClick={handleSkip}>
              <Text className="text-sm text-gray-400">暂不验证，以客人身份浏览</Text>
            </View>
          </View>

          {/* 底部说明 */}
          <View className="px-6 py-4 bg-gray-50">
            <Text className="block text-xs text-gray-400 text-center">
              验证码由家庭管理员提供{'\n'}
              验证后可获得点菜、修改菜单等权限
            </Text>
          </View>
        </View>
      </View>
    );
  }
};
