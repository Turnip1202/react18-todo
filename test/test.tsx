import React, { useState, useRef, createContext, useContext } from 'react';
import { Button, Input, Select, DatePicker, message } from 'antd';
import dayjs from 'dayjs';

// 创建表单上下文
interface FormContextType {
  formState: Record<string, any>;
  setFormState: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  validateFields: () => boolean;
  rules: Record<string, Array<{ required?: boolean; message?: string }>>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// 自定义表单组件
interface CustomFormProps {
  onFinish: (values: Record<string, any>) => void;
  children: React.ReactNode;
}

function CustomForm({ onFinish, children }: CustomFormProps) {
  // 表单状态管理 - 这是底层存储所有表单数据的地方
  const [formState, setFormState] = useState<Record<string, any>>({});
  // 存储验证规则
  const [rules, setRules] = useState<Record<string, Array<any>>>({});
  // 提交按钮引用
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // 验证字段的方法
  const validateFields = (): boolean => {
    let isValid = true;
    
    // 遍历所有带有验证规则的字段
    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      fieldRules.forEach(rule => {
        if (rule.required && (!formState[fieldName] || formState[fieldName] === '')) {
          message.error(rule.message || `字段 ${fieldName} 是必填的`);
          isValid = false;
        }
      });
    });
    
    return isValid;
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证通过后调用用户提供的onFinish回调
    if (validateFields()) {
      onFinish(formState);
    }
  };

  // 重置表单
  const resetFields = () => {
    setFormState({});
  };

  return (
    <FormContext.Provider value={{ formState, setFormState, validateFields, rules }}>
      <form onSubmit={handleSubmit}>
        {children}
      </form>
      {/* 这里可以添加其他表单操作方法 */}
    </FormContext.Provider>
  );
}

// 自定义表单项组件
interface FormItemProps {
  name: string;
  label: string;
  rules?: Array<{ required?: boolean; message?: string }>;
  initialValue?: any;
  children: React.ReactNode;
}

function FormItem({ name, label, rules = [], initialValue, children }: FormItemProps) {
  const formContext = useContext(FormContext);
  
  if (!formContext) {
    throw new Error('FormItem must be used within a CustomForm');
  }

  const { formState, setFormState, rules: contextRules, validateFields } = formContext;
  
  // 注册验证规则
  React.useEffect(() => {
    if (rules.length > 0) {
      formContext.setRules(prev => ({
        ...prev,
        [name]: rules
      }));
    }
  }, [name, rules, formContext]);

  // 初始化值
  React.useEffect(() => {
    if (initialValue !== undefined && formState[name] === undefined) {
      setFormState(prev => ({
        ...prev,
        [name]: initialValue
      }));
    }
  }, [name, initialValue, formState, setFormState]);

  // 处理值变化
  const handleChange = (value: any) => {
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 根据子组件类型适配onChange处理
  const renderChildren = () => {
    if (React.isValidElement(children)) {
      // 克隆子组件并注入onChange和value属性
      return React.cloneElement(children as React.ReactElement, {
        onChange: handleChange,
        value: formState[name],
      });
    }
    return children;
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px' }}>{label}</label>
      {renderChildren()}
    </div>
  );
}

// 自定义提交按钮
interface SubmitButtonProps {
  children: React.ReactNode;
}

function SubmitButton({ children }: SubmitButtonProps) {
  return (
    <Button type="primary" htmlType="submit">
      {children}
    </Button>
  );
}

// 使用示例
function FormExample() {
  const handleFinish = (values: Record<string, any>) => {
    console.log('表单提交的值:', values);
    message.success('提交成功！');
    // 这里可以处理表单提交后的逻辑
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>自定义表单实现示例</h3>
      <CustomForm onFinish={handleFinish}>
        <FormItem 
          name="title" 
          label="标题" 
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入标题" />
        </FormItem>
        
        <FormItem 
          name="priority" 
          label="优先级" 
          initialValue="normal"
        >
          <Select 
            style={{ width: 160 }} 
            options={[
              { value: 'low', label: '低' },
              { value: 'normal', label: '中' },
              { value: 'high', label: '高' }
            ]} 
          />
        </FormItem>
        
        <FormItem 
          name="dueDate" 
          label="截止日期" 
          initialValue={dayjs()}
        >
          <DatePicker />
        </FormItem>
        
        <SubmitButton>提交</SubmitButton>
      </CustomForm>
    </div>
  );
}

export default FormExample;