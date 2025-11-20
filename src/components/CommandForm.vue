<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useCommandStore } from '../stores/commandStore';
import { Command } from '../types/command';
import { ElMessage } from 'element-plus';

const commandStore = useCommandStore();

const props = defineProps<{
  editMode: boolean;
  commandToEdit?: Command;
}>();

const emit = defineEmits(['form-submitted', 'cancel']);

// 表单数据
const formData = reactive({
  title: '',
  command: '',
  description: '',
  tags: [] as string[]
});

// 新标签输入
const newTag = ref('');
const allTags = computed(() => commandStore.allTags);

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应在2到50个字符之间', trigger: 'blur' }
  ],
  command: [
    { required: true, message: '请输入命令', trigger: 'blur' }
  ]
};

// 表单引用
const formRef = ref();

// 监听编辑模式和编辑对象的变化
watch(() => props.commandToEdit, (newVal) => {
  if (newVal && props.editMode) {
    // 填充表单数据
    formData.title = newVal.title;
    formData.command = newVal.command;
    formData.description = newVal.description;
    formData.tags = [...newVal.tags];
  }
}, { immediate: true });

// 添加标签
function addTag() {
  if (newTag.value && !formData.tags.includes(newTag.value)) {
    formData.tags.push(newTag.value);
    newTag.value = '';
  }
}

// 移除标签
function removeTag(tag: string) {
  const index = formData.tags.indexOf(tag);
  if (index !== -1) {
    formData.tags.splice(index, 1);
  }
}

// 提交表单
async function submitForm() {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (props.editMode && props.commandToEdit) {
        // 更新命令
        commandStore.updateCommand(props.commandToEdit.id, {
          title: formData.title,
          command: formData.command,
          description: formData.description,
          tags: formData.tags
        });
        ElMessage.success('命令已更新');
      } else {
        // 添加新命令
        commandStore.addCommand({
          title: formData.title,
          command: formData.command,
          description: formData.description,
          tags: formData.tags
        });
        ElMessage.success('命令已添加');
      }
      
      // 重置表单
      resetForm();
      
      // 通知父组件表单已提交
      emit('form-submitted');
    }
  });
}

// 重置表单
function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  formData.title = '';
  formData.command = '';
  formData.description = '';
  formData.tags = [];
}

// 取消操作
function cancel() {
  resetForm();
  emit('cancel');
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="command-form"
  >
  <el-form-item label="标题" prop="title">
      <el-input v-model="formData.title" placeholder="输入命令标题" maxlength="50" show-word-limit />
  </el-form-item>
    
  <el-form-item label="命令" prop="command">
      <el-input
        v-model="formData.command"
        type="textarea"
        :rows="3"
        maxlength="1000"
        show-word-limit
        placeholder="输入命令内容"
      />
  </el-form-item>
    
  <el-form-item label="描述" prop="description">
      <el-input
        v-model="formData.description"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        placeholder="输入命令描述（可选）"
      />
  </el-form-item>
    
  <el-form-item label="标签">
      <div class="tag-row">
        <div class="tag-input">
          <el-select v-model="formData.tags" multiple filterable allow-create default-first-option placeholder="选择已有标签" size="default" style="width:100%">
            <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </div>
        <div class="tag-input secondary">
          <el-input v-model="newTag" placeholder="添加新标签" @keyup.enter="addTag" size="default" style="width:100%">
            <template #append>
              <el-button @click="addTag" size="default">
                <el-icon><Plus /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
      
      <div class="tags-container">
        <el-tag
          v-for="tag in formData.tags"
          :key="tag"
          closable
          @close="removeTag(tag)"
          class="tag-item"
        >
          {{ tag }}
        </el-tag>
      </div>
    </el-form-item>
    
  <el-form-item>
      <el-button type="primary" @click="submitForm">
        {{ props.editMode ? '更新' : '添加' }}
      </el-button>
      <el-button @click="cancel">取消</el-button>
      <el-button @click="resetForm" type="warning">清空</el-button>
  </el-form-item>
  </el-form>
</template>

<style scoped>
.command-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 12px;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-input {
  margin-bottom: 0;
  flex: 2;
}
.tag-input.secondary { margin-top: 0; flex: 1; }

/* 让内部控件在 scoped 样式下也能占满容器并保持同高 */
:deep(.tag-row .el-select),
:deep(.tag-row .el-input) {
  width: 100%;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  margin-right: 5px;
  margin-bottom: 5px;
}
</style>